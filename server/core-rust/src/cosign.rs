use ed25519_dalek::{Keypair, PublicKey, Signature, Signer, Verifier};
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct SignatureData {
    pub cosigner: String,
    pub sig: String,
}

pub struct Cosigner {
    pub id: String,
    pub keypair: Keypair,
}

pub fn load_cosigners() -> Result<Vec<Cosigner>, Box<dyn std::error::Error>> {
    let mut cosigners = Vec::new();
    
    for i in 0..3 {
        let env_key = format!("COSIGNER_{}_SK", i);
        
        if let Ok(private_key_b64) = std::env::var(&env_key) {
            let private_key_bytes = BASE64.decode(private_key_b64)?;
            let keypair = Keypair::from_bytes(&private_key_bytes)?;
            
            cosigners.push(Cosigner {
                id: format!("cosigner_{}", i),
                keypair,
            });
        }
    }
    
    Ok(cosigners)
}

pub fn sign_sth(sth_hash: &[u8], cosigners: &[Cosigner]) -> Vec<SignatureData> {
    let mut signatures = Vec::new();
    
    for cosigner in cosigners.iter().take(3) {
        let signature = cosigner.keypair.sign(sth_hash);
        signatures.push(SignatureData {
            cosigner: cosigner.id.clone(),
            sig: BASE64.encode(signature.to_bytes()),
        });
        
        if signatures.len() >= 2 {
            break; // We have threshold
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
                if let Ok(signature) = Signature::from_bytes(&sig_bytes) {
                    if cosigner.keypair.public.verify(sth_hash, &signature).is_ok() {
                        valid_count += 1;
                    }
                }
            }
        }
    }
    
    valid_count >= threshold
}

#[cfg(test)]
mod tests {
    use super::*;
    use ed25519_dalek::Keypair;
    use rand::rngs::OsRng;

    #[test]
    fn test_sign_and_verify() {
        let mut csprng = OsRng {};
        let cosigners: Vec<Cosigner> = (0..3)
            .map(|i| Cosigner {
                id: format!("cosigner_{}", i),
                keypair: Keypair::generate(&mut csprng),
            })
            .collect();

        let message = b"test message";
        let signatures = sign_sth(message, &cosigners);
        
        assert!(signatures.len() >= 2);
        assert!(verify_threshold(message, &signatures, &cosigners, 2));
    }
}
