use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use ed25519::{Signature, Verifier};
use ed25519_dalek::{Signer, SigningKey, VerifyingKey};
use rand::rngs::OsRng;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct SignatureData {
    pub cosigner: String,
    pub sig: String, // base64
}

pub struct Cosigner {
    pub id: String,
    pub signing: SigningKey,
    pub verifying: VerifyingKey,
}

pub fn load_cosigners() -> Vec<Cosigner> {
    let mut cosigners = Vec::new();
    for i in 0..3 {
        let mut rng = OsRng;
        let signing = SigningKey::generate(&mut rng);
        let verifying = signing.verifying_key();
        cosigners.push(Cosigner {
            id: format!("cosigner_{}", i),
            signing,
            verifying,
        });
    }
    cosigners
}

pub fn sign_sth(sth_hash: &[u8], cosigners: &[Cosigner]) -> Vec<SignatureData> {
    let mut signatures = Vec::new();
    for cosigner in cosigners.iter().take(3) {
        let signature = cosigner.signing.sign(sth_hash);
        signatures.push(SignatureData {
            cosigner: cosigner.id.clone(),
            sig: BASE64.encode(signature.to_bytes()),
        });
        if signatures.len() >= 2 {
            break; // threshold 2-of-3
        }
    }
    signatures
}

pub fn verify_threshold(
    sth_hash: &[u8],
    signatures: &[SignatureData],
    cosigners: &[Cosigner],
    threshold: usize,
) -> bool {
    let mut valid_count = 0;

    for sig_data in signatures {
        if let Some(cosigner) = cosigners.iter().find(|c| c.id == sig_data.cosigner) {
            if let Ok(sig_bytes) = BASE64.decode(&sig_data.sig) {
                if let Ok(signature) = Signature::from_slice(&sig_bytes) {
                    if cosigner.verifying.verify(sth_hash, &signature).is_ok() {
                        valid_count += 1;
                    }
                }
            }
        }
    }
    valid_count >= threshold
}
