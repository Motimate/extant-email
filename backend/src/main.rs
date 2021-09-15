use actix_web::{
    error, get, middleware, post, web, App, HttpRequest, HttpResponse, HttpServer, Responder,
};
use extant::mail::{retry, EmailCheckInput, EmailCheckResponse, MyReachable};
use futures::{executor, future};
use log::info;
use serde::{Deserialize, Serialize};
use std::env;
use std::time::Duration;
use std::{sync::mpsc, thread};
fn json_error_handler(err: error::JsonPayloadError, _req: &HttpRequest) -> error::Error {
    use actix_web::error::JsonPayloadError;

    let detail = err.to_string();
    let resp = match &err {
        JsonPayloadError::ContentType => HttpResponse::UnsupportedMediaType().body(detail),
        JsonPayloadError::Deserialize(json_err) if json_err.is_data() => {
            HttpResponse::UnprocessableEntity().body(detail)
        }
        _ => HttpResponse::BadRequest().body(detail),
    };
    error::InternalError::from_response(err, resp).into()
}

#[derive(Hash, Eq, PartialEq, Debug, Serialize, Deserialize)]
struct Stats {
    risky: i32,
    safe: i32,
    invalid: i32,
    unknown: i32,
    total: i32,
}

impl Stats {
    fn new(risky: i32, safe: i32, invalid: i32, unknown: i32, total: i32) -> Stats {
        Stats {
            risky,
            safe,
            invalid,
            unknown,
            total,
        }
    }
}

#[derive(Serialize, Deserialize)]
struct ResponseData {
    items: Vec<EmailCheckResponse>,
    stats: Stats,
}

#[post("/api/email_check")]
async fn email_check(emails: web::Json<Vec<String>>) -> impl Responder {
    let items: Vec<EmailCheckResponse>;

    if emails[0] == "test@test.com" {
        let mut test_inputs: Vec<EmailCheckResponse> = Vec::new();
        for _ in 1..2000 {
            let random_status: MyReachable = rand::random();
            test_inputs.push(EmailCheckResponse {
                is_reachable: random_status,
                ..Default::default()
            })
        }

        items = test_inputs;
    } else {
        let hostname = match gethostname::gethostname().into_string() {
            Ok(hostname) => hostname,
            _ => String::from("localhost"),
        };
        let inputs = emails.iter().map(|email| EmailCheckInput {
            to_emails: vec![email.to_string()],
            from_email: env::var("FROM_EMAIL").unwrap_or("user@example.com".to_string()),
            hello_name: env::var("HELLO_NAME").unwrap_or(hostname.to_owned()),
            smtp_timeout: Some(Duration::from_secs(10)),
            ..Default::default()
        });

        items = future::join_all(inputs.map(|i| retry(i, 2))).await;
    }

    let mut stats = Stats::new(0, 0, 0, 0, 0);

    items.iter().for_each(|item| {
        stats.total += 1;
        match item.is_reachable {
            MyReachable::Invalid => stats.invalid += 1,
            MyReachable::Risky => stats.risky += 1,
            MyReachable::Safe => stats.safe += 1,
            MyReachable::Unknown => stats.unknown += 1,
        };
    });

    HttpResponse::Ok().json(ResponseData { items, stats })
}

#[get("/")]
async fn index() -> impl Responder {
    HttpResponse::Ok().body("OK")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(
        env_logger::Env::new().default_filter_or("check-if-email-exists,info"),
    );

    info!("Hostname: {:?}", gethostname::gethostname());

    let port = env::var("PORT").unwrap_or(String::from("8080"));
    let host = env::var("HOST").unwrap_or(String::from("0.0.0.0"));

    let (tx, rx) = mpsc::channel::<()>();
    let server = HttpServer::new(move || {
        App::new()
            .app_data(tx.clone())
            .app_data(web::JsonConfig::default().error_handler(json_error_handler))
            .wrap(middleware::Compress::default())
            .wrap(middleware::Logger::default())
            .service(email_check)
            .service(index)
    })
    .bind(format!("{}:{}", host, port))?
    .run();

    let srv = server.clone();
    thread::spawn(move || {
        rx.recv().unwrap();

        executor::block_on(srv.stop(true))
    });

    server.await
}
