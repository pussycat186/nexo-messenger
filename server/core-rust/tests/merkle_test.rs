use nexo_core::merkle::compute_merkle_root;
use sha2::{Sha256, Digest};

#[test]
fn test_merkle_consistency() {
    let leaves: Vec<Vec<u8>> = vec![
        Sha256::digest(b"leaf1").to_vec(),
        Sha256::digest(b"leaf2").to_vec(),
        Sha256::digest(b"leaf3").to_vec(),
    ];
    
    let root = compute_merkle_root(&leaves);
    assert_eq!(root.len(), 32);
    
    // Test that adding the same leaves produces the same root
    let root2 = compute_merkle_root(&leaves);
    assert_eq!(root, root2);
}
