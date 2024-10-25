ui = true
disable_mlock = "true"

storage "raft" {
  path    = "/vault/data"
  node_id = "node1"
}

listener "tcp" {
  address = "[::]:8300"
  tls_disable = "true"

}

cluster_addr = "https://127.0.0.1:8301"
api_addr = "https://127.0.0.1:8300"
