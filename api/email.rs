use check_if_email_exists::{check_email, CheckEmailInput, CheckEmailInputProxy, Reachable};
use futures::executor::block_on;
use http::StatusCode;
use serde::Serialize;
use serde_json::{json, Value};
use std::borrow::Cow;
use std::error::Error;
use vercel_lambda::{error::VercelError, lambda, IntoResponse, Request, Response};
#[derive(Debug, Serialize)]
struct EmailCheckResponse {
    is_reachable: String,
    email: String,
    is_disposable: Option<bool>,
    is_role_account: Option<bool>,
    can_connect_smtp: Option<bool>,
    has_full_inbox: Option<bool>,
    is_catch_all: Option<bool>,
    is_deliverable: Option<bool>,
    is_disabled: Option<bool>,
}

async fn check_emails(emails: &Vec<String>) -> Vec<EmailCheckResponse> {
    let input = CheckEmailInput::new(emails.clone());
    let result = check_email(&input).await;

    let mut responses: Vec<EmailCheckResponse> = Vec::new();

    for item in result.iter() {
        let mut ecr = EmailCheckResponse {
            email: item.input.clone(),
            is_reachable: match &item.is_reachable {
                Reachable::Safe => "safe".into(),
                Reachable::Risky => "risky".into(),
                Reachable::Invalid => "invalid".into(),
                Reachable::Unknown => "unknown".into(),
            },
            is_disposable: None,
            is_role_account: None,
            has_full_inbox: None,
            can_connect_smtp: None,
            is_catch_all: None,
            is_deliverable: None,
            is_disabled: None,
        };

        match &item.misc {
            Ok(misc) => {
                ecr.is_disposable = Some(misc.is_disposable);
                ecr.is_role_account = Some(misc.is_role_account);
            }
            _ => {}
        }

        match &item.smtp {
            Ok(smtp) => {
                ecr.has_full_inbox = Some(smtp.has_full_inbox);
                ecr.is_catch_all = Some(smtp.is_catch_all);
                ecr.is_deliverable = Some(smtp.is_deliverable);
                ecr.is_disabled = Some(smtp.is_disabled);
                ecr.can_connect_smtp = Some(smtp.can_connect_smtp);
            }
            _ => {}
        }

        responses.push(ecr);
    }

    responses
}

fn handler(req: Request) -> Result<impl IntoResponse, VercelError> {
    let (parts, body) = req.into_parts();
    let json_body: serde_json::Result<Value> = serde_json::from_slice(&body);

    if parts.method != "POST" {
        let response = Response::builder()
            .status(StatusCode::METHOD_NOT_ALLOWED)
            .body(String::from("Not allowed"))
            .unwrap();

        return Ok(response);
    }

    let mut body_str = String::from("");
    let mut status_code = StatusCode::OK;

    match json_body {
        Ok(json_body) => {
            let default_value: Vec<Value> = Vec::new();
            let emails = json_body.as_array().unwrap_or(&default_value);

            let mut email_strings: Vec<String> = vec![];

            for email in emails.iter() {
                match email {
                    Value::String(email) => {
                        println!("> {}", email);
                        email_strings.push(email.clone());
                    }
                    _ => {}
                }
            }

            if email_strings.len() > 0 {
                let checked_emails = block_on(check_emails(&email_strings));
                let serialized_emails = serde_json::to_string(&checked_emails);

                match serialized_emails {
                    Ok(emails) => {
                        body_str = emails;
                    }
                    Err(e) => {
                        body_str = e.to_string();
                        status_code = StatusCode::INTERNAL_SERVER_ERROR;
                    }
                }
            }
        }
        Err(e) => {
            body_str = String::from("UNPROCESSABLE_ENTITY");
            status_code = StatusCode::UNPROCESSABLE_ENTITY;
        }
    };

    let response = Response::builder()
        .status(status_code)
        .header("Content-Type", "application/json")
        .body(body_str)
        .expect("Internal Server Error");

    Ok(response)
}

// Start the runtime with the handler
fn main() -> Result<(), Box<dyn Error>> {
    Ok(lambda!(handler))
}
