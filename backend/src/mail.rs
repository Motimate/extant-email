// https://github.com/reacherhq/check-if-email-exist

use std::fmt;
use std::hash::Hash;
use std::time::Duration;

use async_recursion::async_recursion;
use async_std_resolver::lookup::MxLookup;
use async_std_resolver::{config, resolver, ResolveError};
use cached::proc_macro::cached;
use cached::SizedCache;
use check_if_email_exists::misc::{check_misc, MiscDetails};
use check_if_email_exists::mx::MxDetails;
use check_if_email_exists::syntax::check_syntax;
use check_if_email_exists::CheckEmailInput;
use log::debug;
use rand::{
    distributions::{Distribution, Standard},
    Rng,
};
use serde::{Deserialize, Serialize};

use crate::smtp::{check_smtp, SmtpDetails, SmtpError};

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum MyReachable {
    Safe,
    Risky,
    Invalid,
    Unknown,
    Banned,
}

impl fmt::Display for MyReachable {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match *self {
            MyReachable::Invalid => write!(f, "invalid"),
            MyReachable::Risky => write!(f, "risky"),
            MyReachable::Safe => write!(f, "safe"),
            MyReachable::Unknown => write!(f, "unknown"),
            MyReachable::Banned => write!(f, "banned"),
        }
    }
}

impl Distribution<MyReachable> for Standard {
    fn sample<R: Rng + ?Sized>(&self, rng: &mut R) -> MyReachable {
        match rng.gen_range(0..=5) {
            0 => MyReachable::Invalid,
            1 => MyReachable::Risky,
            2 => MyReachable::Safe,
            3 => MyReachable::Unknown,
            4 => MyReachable::Banned,
            _ => MyReachable::Safe,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailCheckResponse {
    pub is_reachable: MyReachable,
    pub email: String,
    pub is_disposable: Option<bool>,
    pub is_role_account: Option<bool>,
    pub can_connect_smtp: Option<bool>,
    pub has_full_inbox: Option<bool>,
    pub is_catch_all: Option<bool>,
    pub is_deliverable: Option<bool>,
    pub is_disabled: Option<bool>,
    pub is_banned: Option<bool>,
}

impl Default for EmailCheckResponse {
    fn default() -> Self {
        EmailCheckResponse {
            is_reachable: MyReachable::Unknown,
            email: String::from("Unknown"),
            is_disposable: None,
            is_role_account: None,
            can_connect_smtp: None,
            has_full_inbox: None,
            is_catch_all: None,
            is_deliverable: None,
            is_disabled: None,
            is_banned: None,
        }
    }
}

#[derive(Debug, PartialEq, Eq, Hash, Clone, Serialize, Deserialize)]
pub struct EmailCheckInput {
    pub to_emails: Vec<String>,
    /// Email to use in the `MAIL FROM:` SMTP command.
    ///
    /// Defaults to "user@example.org".
    pub from_email: String,
    /// Name to use in the `EHLO:` SMTP command.
    ///
    /// Defaults to "localhost" (note: "localhost" is not a FQDN).
    pub hello_name: String,
    /// Add optional timeout for the SMTP verification step.
    pub smtp_timeout: Option<Duration>,
    /// For Yahoo email addresses, use Yahoo's API instead of connecting
    /// directly to their SMTP servers.
    ///
    /// Defaults to true.
    pub yahoo_use_api: bool,
}

impl Default for EmailCheckInput {
    fn default() -> Self {
        EmailCheckInput {
            to_emails: vec![],
            from_email: "user@example.org".into(),
            hello_name: "localhost".into(),
            smtp_timeout: None,
            yahoo_use_api: true,
        }
    }
}

impl EmailCheckInput {
    /// Create a new CheckEmailInput.
    pub fn new(to_emails: Vec<String>) -> EmailCheckInput {
        EmailCheckInput {
            to_emails,
            ..Default::default()
        }
    }

    /// Set the email to use in the `MAIL FROM:` SMTP command. Defaults to
    /// `user@example.org` if not explicitly set.
    pub fn set_from_email(&mut self, email: String) -> &mut EmailCheckInput {
        self.from_email = email;
        self
    }

    /// Set the name to use in the `EHLO:` SMTP command. Defaults to `localhost`
    /// if not explicitly set.
    pub fn set_hello_name(&mut self, name: String) -> &mut EmailCheckInput {
        self.hello_name = name;
        self
    }

    /// Add optional timeout for the SMTP verification step.
    pub fn set_smtp_timeout(&mut self, duration: Duration) -> &mut EmailCheckInput {
        self.smtp_timeout = Some(duration);
        self
    }

    /// Set whether to use Yahoo's API or connecting directly to their SMTP
    /// servers. Defaults to true.
    pub fn set_yahoo_use_api(&mut self, use_api: bool) -> &mut EmailCheckInput {
        self.yahoo_use_api = use_api;
        self
    }
}

fn calculate_reachable(misc: &MiscDetails, smtp: &Result<SmtpDetails, SmtpError>) -> MyReachable {
    if let Ok(smtp) = smtp {
        if misc.is_disposable || misc.is_role_account || smtp.is_catch_all || smtp.has_full_inbox {
            return MyReachable::Risky;
        }

        if smtp.is_banned {
            return MyReachable::Banned;
        }

        if !smtp.is_deliverable || !smtp.can_connect_smtp || smtp.is_disabled {
            return MyReachable::Invalid;
        }

        MyReachable::Safe
    } else {
        MyReachable::Unknown
    }
}

#[async_recursion]
pub async fn retry(input: EmailCheckInput, count: usize) -> EmailCheckResponse {
    log::info!("[email={}] attempt #{}", input.to_emails[0], count,);

    let result = match check_single_email(input.clone()).await {
        Ok(result) => result,
        Err(result) => result,
    };

    log::debug!(
        "[email={}] Got result, attempt #{}, is_reachable={:?}",
        input.to_emails[0],
        count,
        result.is_reachable
    );

    if result.is_reachable == MyReachable::Unknown {
        if count <= 1 {
            return result;
        } else {
            retry(input, count - 1).await
        }
    } else {
        return result;
    }
}

#[cached(result = true)]
pub async fn check_mx_domain(domain: String) -> Result<MxLookup, ResolveError> {
    let resolver = resolver(
        config::ResolverConfig::default(),
        config::ResolverOpts::default(),
    )
    .await?;

    match resolver.mx_lookup(domain.as_ref()).await {
        Ok(lookup) => Ok(lookup),
        Err(err) => Err(err),
    }
}

// Return a `Result` here simply to bust cache, it will always have the expected value
//  but an `Err` means it won't be cached, while `Ok` means it will be cached
#[cached(
    type = "SizedCache<String, EmailCheckResponse>",
    create = "{ SizedCache::with_size(100) }",
    convert = r#"{ input.to_emails[0].to_owned() }"#,
    result = true
)]
pub async fn check_single_email(
    input: EmailCheckInput,
) -> Result<EmailCheckResponse, EmailCheckResponse> {
    let ciee_input = CheckEmailInput {
        from_email: input.from_email.clone(),
        hello_name: input.hello_name.clone(),
        proxy: None,
        smtp_timeout: input.smtp_timeout.clone(),
        to_emails: input.to_emails.clone(),
        yahoo_use_api: input.yahoo_use_api.clone(),
    };

    let to_email = &input.to_emails[0];

    let my_syntax = check_syntax(to_email.as_ref());
    if !my_syntax.is_valid_syntax {
        return Ok(EmailCheckResponse {
            email: to_email.to_string(),
            is_reachable: MyReachable::Invalid,
            ..Default::default()
        });
    }

    debug!("{:?}", my_syntax);

    let my_mx = match check_mx_domain(my_syntax.domain.clone()).await {
        Ok(m) => MxDetails::from(m),
        _e => {
            return Err(EmailCheckResponse {
                email: to_email.to_string(),
                is_reachable: MyReachable::Unknown,
                ..Default::default()
            });
        }
    };

    debug!("{:?}", my_mx);

    if my_mx.lookup.is_err() {
        return Err(EmailCheckResponse {
            email: to_email.to_string(),
            is_reachable: MyReachable::Invalid,
            ..Default::default()
        });
    }

    let my_misc = check_misc(&my_syntax);

    debug!("{:?}", my_misc);

    let my_smtp = my_mx
        .lookup
        .as_ref()
        .expect("If lookup is error, we already returned. qed.")
        .iter()
        .next()
        .map(|host| {
            check_smtp(
                my_syntax
                    .address
                    .as_ref()
                    .expect("We already checked that the email has valid format. qed."),
                host.exchange(),
                // FIXME We could add ports 465 and 587 too.
                25,
                my_syntax.domain.as_ref(),
                &ciee_input,
            )
        })
        .expect("Lookup cannot be empty. qed.")
        .await;

    debug!("{:?}", my_smtp);

    let mut result = EmailCheckResponse {
        email: to_email.to_string(),
        is_reachable: calculate_reachable(&my_misc, &my_smtp),
        is_disposable: Some(my_misc.is_disposable),
        is_role_account: Some(my_misc.is_role_account),
        ..Default::default()
    };

    match my_smtp {
        Ok(smtp) => {
            result.has_full_inbox = Some(smtp.has_full_inbox);
            result.is_catch_all = Some(smtp.is_catch_all);
            result.is_deliverable = Some(smtp.is_deliverable);
            result.is_disabled = Some(smtp.is_disabled);
            result.can_connect_smtp = Some(smtp.can_connect_smtp);
            result.is_banned = Some(smtp.is_banned);
        }
        _ => {}
    }

    if result.is_reachable == MyReachable::Unknown
        || result.is_reachable == MyReachable::Banned
        || result.is_reachable == MyReachable::Invalid
    {
        return Err(result);
    }

    Ok(result)
}
