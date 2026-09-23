mod clash;
#[allow(clippy::module_inception)]
mod config;
pub(crate) mod dns;
mod encrypt;
mod mixed_port;
mod orbit;
mod port;
mod prfitem;
pub mod profiles;
pub mod runtime;
pub(crate) mod snapshot;

pub(crate) use self::config::Config;
pub use self::{clash::*, encrypt::*, mixed_port::*, orbit::*, prfitem::*, profiles::*};

pub const DEFAULT_PAC: &str = r#"function FindProxyForURL(url, host) {
  return "PROXY 127.0.0.1:%mixed-port%; SOCKS5 127.0.0.1:%mixed-port%; DIRECT;";
}
"#;
