use actix_web::{
    error, get, middleware, post, web, App, HttpRequest, HttpResponse, HttpServer, Responder,
};
use extant::mail::{check_single_email, EmailCheckInput};
use futures::{executor, future};
use std::env;
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

#[post("/api/email_check")]
async fn email_check(emails: web::Json<Vec<String>>) -> impl Responder {
    let inputs = emails.iter().map(|email| EmailCheckInput {
        to_emails: vec![email.to_string()],
        from_email: env::var("FROM_EMAIL").unwrap_or("user@example.com".to_string()),
        hello_name: env::var("HELLO_NAME").unwrap_or("localhost".to_string()),
        ..Default::default()
    });

    let email_checks = future::join_all(inputs.map(check_single_email)).await;

    HttpResponse::Ok().json(email_checks)
}

#[get("/")]
async fn index() -> impl Responder {
    HttpResponse::Ok().body("OK")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("check-if-email-exists"));

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
