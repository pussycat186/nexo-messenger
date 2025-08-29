use sha2::{Sha256, Digest};

pub fn compute_merkle_root(leaves: &[Vec<u8>]) -> Vec<u8> {
    if leaves.is_empty() {
        return vec![0; 32]; // Zero hash for empty tree
    }

    let mut level: Vec<Vec<u8>> = leaves.to_vec();
    
    while level.len() > 1 {
        let mut next_level = Vec::new();
        
        for chunk in level.chunks(2) {
            if chunk.len() == 2 {
                // Pair exists, hash together
                let mut hasher = Sha256::new();
                hasher.update(&chunk[0]);
                hasher.update(&chunk[1]);
                next_level.push(hasher.finalize().to_vec());
            } else {
                // Odd leaf, carry up
                next_level.push(chunk[0].clone());
            }
        }
        
        level = next_level;
    }
    
    level[0].clone()
}

#[cfg(test)]
mod tests {
    use super::*;
    use sha2::{Sha256, Digest};

    #[test]
    fn test_empty_tree() {
        let root = compute_merkle_root(&[]);
        assert_eq!(root.len(), 32);
        assert_eq!(root, vec![0; 32]);
    }

    #[test]
    fn test_single_leaf() {
        let leaf = b"test leaf".to_vec();
        let root = compute_merkle_root(&[leaf.clone()]);
        assert_eq!(root, leaf);
    }

    #[test]
    fn test_two_leaves() {
        let leaf1 = Sha256::digest(b"leaf1").to_vec();
        let leaf2 = Sha256::digest(b"leaf2").to_vec();
        
        let expected = {
            let mut hasher = Sha256::new();
            hasher.update(&leaf1);
            hasher.update(&leaf2);
            hasher.finalize().to_vec()
        };
        
        let root = compute_merkle_root(&[leaf1, leaf2]);
        assert_eq!(root, expected);
    }
}
