use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use ed25519::{Signature, Signer, Verifier};
use ed25519_dalek::{SigningKey, VerifyingKey};
use rand::rngs::OsRng;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SignatureData {
    pub cosigner: String,
    pub sig: String, // base64(signature bytes)
}

pub struct Cosigner {
    pub id: String,
    pub signing: SigningKey,
    pub verifying: VerifyingKey,
}

// Generate 3 cosigners in dev (could be read from env/secret later)
pub fn load_cosigners() -> Vec<Cosigner> {
    (0..3)
        .map(|i| {
            let signing = SigningKey::generate(&mut OsRng);
            let verifying = signing.verifying_key();
            Cosigner {
                id: format!("cosigner_{}", i),
                signing,
                verifying,
            }
        })
        .collect()
}

// Sign message hash and return base64 signature for each cosigner, but stop when threshold is reached
pub fn sign_sth(sth_bytes: &[u8], cosigners: &[Cosigner], threshold: usize) -> Vec<SignatureData> {
    let mut out = Vec::new();
    for c in cosigners {
        let sig: Signature = c.signing.sign(sth_bytes);
        out.push(SignatureData {
            cosigner: c.id.clone(),
            sig: BASE64.encode(sig.to_bytes()),
        });
        if out.len() >= threshold {
            break;
        }
    }
    out
}

pub fn verify_threshold(
    message: &[u8],
    signatures: &[SignatureData],
    cosigners: &[Cosigner],
    threshold: usize,
) -> bool {
    let mut ok = 0usize;
    for s in signatures {
        if let Some(c) = cosigners.iter().find(|c| c.id == s.cosigner) {
            if let Ok(sig_bytes) = BASE64.decode(&s.sig) {
                if let Ok(sig) = Signature::from_bytes(
                    sig_bytes
                        .as_slice()
                        .try_into()
                        .unwrap_or_else(|_| [0u8; 64]),
                ) {
                    if c.verifying.verify(message, &sig).is_ok() {
                        ok += 1;
                        if ok >= threshold {
                            return true;
                        }
                    }
                }
            }
        }
    }
    ok >= threshold
}
