use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use ed25519::{Signature, Signer, Verifier};
use ed25519_dalek::{SigningKey, VerifyingKey};
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

fn to_32(bytes: &[u8]) -> Option<[u8; 32]> {
    if bytes.len() >= 32 {
        let mut arr = [0u8; 32];
        arr.copy_from_slice(&bytes[..32]);
        Some(arr)
    } else {
        None
    }
}

pub fn load_cosigners() -> Result<Vec<Cosigner>, Box<dyn std::error::Error>> {
    let mut cosigners = Vec::new();
    for i in 0..3 {
        let env_key = format!("COSIGNER_{}_SK", i);
        if let Ok(private_key_b64) = std::env::var(&env_key) {
            let private_key_bytes = BASE64.decode(private_key_b64)?;
            if let Some(sk32) = to_32(&private_key_bytes) {
                let signing = SigningKey::from_bytes(&sk32);
                let verifying = VerifyingKey::from(&signing);
                cosigners.push(Cosigner {
                    id: format!("cosigner_{}", i),
                    signing,
                    verifying,
                });
            }
        }
    }
    Ok(cosigners)
}

pub fn sign_sth(sth_hash: &[u8], cosigners: &[Cosigner]) -> Vec<SignatureData> {
    let mut signatures = Vec::new();
    for cosigner in cosigners.iter().take(3) {
        let signature: Signature = cosigner.signing.sign(sth_hash);
        signatures.push(SignatureData {
            cosigner: cosigner.id.clone(),
            sig: BASE64.encode(signature.to_bytes()),
        });
        if signatures.len() >= 2 {
            break; // đạt ngưỡng 2-of-3
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
    let mut valid = 0usize;
    for sig_data in signatures {
        if let Some(cos) = cosigners.iter().find(|c| c.id == sig_data.cosigner) {
            if let Ok(raw) = BASE64.decode(&sig_data.sig) {
                if let Ok(sig) = Signature::from_slice(&raw) {
                    if cos.verifying.verify(sth_hash, &sig).is_ok() {
                        valid += 1;
                    }
                }
            }
        }
    }
    valid >= threshold
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::rngs::OsRng;

    #[test]
    fn threshold_sign_verify() {
        // tạo 3 cosigner random
        let mut cs = Vec::new();
        for i in 0..3 {
            let signing = SigningKey::generate(&mut OsRng);
            let verifying = VerifyingKey::from(&signing);
            cs.push(Cosigner {
                id: format!("cosigner_{}", i),
                signing,
                verifying,
            });
        }
        let msg = b"test-msg";
        let sigs = sign_sth(msg, &cs);
        assert!(sigs.len() >= 2);
        assert!(verify_threshold(msg, &sigs, &cs, 2));
    }
}
