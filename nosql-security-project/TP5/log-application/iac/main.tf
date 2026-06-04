terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
  }
}

provider "kubernetes" {
  config_path    = "~/.kube/config"
  config_context = "docker-desktop"
}

# ── Namespace ────────────────────────────────────────────────
resource "kubernetes_namespace" "logviewer" {
  metadata {
    name = "logviewer"
  }
}

# ── MongoDB Secret ───────────────────────────────────────────
resource "kubernetes_secret" "mongo" {
  metadata {
    name      = "mongo-secret"
    namespace = kubernetes_namespace.logviewer.metadata[0].name
  }
  string_data = {
    MONGO_USERNAME = "admin"
    MONGO_PASSWORD = "changeme123"
    MONGO_URI      = "mongodb://admin:changeme123@mongodb:27017/logviewer?authSource=admin"
  }
}

# ── MongoDB PVC ──────────────────────────────────────────────
resource "kubernetes_persistent_volume_claim" "mongo" {
  metadata {
    name      = "mongo-pvc"
    namespace = kubernetes_namespace.logviewer.metadata[0].name
  }
  spec {
    access_modes = ["ReadWriteOnce"]
    resources {
      requests = { storage = "1Gi" }
    }
  }
}

# ── MongoDB StatefulSet ──────────────────────────────────────
resource "kubernetes_stateful_set" "mongo" {
  metadata {
    name      = "mongodb"
    namespace = kubernetes_namespace.logviewer.metadata[0].name
  }
  spec {
    service_name = "mongodb"
    replicas     = 1
    selector {
      match_labels = { app = "mongodb" }
    }
    template {
      metadata {
        labels = { app = "mongodb" }
      }
      spec {
        container {
          name  = "mongodb"
          image = "mongo:7"
          port { container_port = 27017 }
          env {
            name = "MONGO_INITDB_ROOT_USERNAME"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.mongo.metadata[0].name
                key  = "MONGO_USERNAME"
              }
            }
          }
          env {
            name = "MONGO_INITDB_ROOT_PASSWORD"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.mongo.metadata[0].name
                key  = "MONGO_PASSWORD"
              }
            }
          }
          env {
            name  = "MONGO_INITDB_DATABASE"
            value = "logviewer"
          }
          volume_mount {
            name       = "mongo-storage"
            mount_path = "/data/db"
          }
          resources {
            requests = { cpu = "200m", memory = "256Mi" }
            limits   = { cpu = "500m", memory = "512Mi" }
          }
        }
        volume {
          name = "mongo-storage"
          persistent_volume_claim {
            claim_name = kubernetes_persistent_volume_claim.mongo.metadata[0].name
          }
        }
      }
    }
  }
}

# ── MongoDB Headless Service ─────────────────────────────────
resource "kubernetes_service" "mongo" {
  metadata {
    name      = "mongodb"
    namespace = kubernetes_namespace.logviewer.metadata[0].name
  }
  spec {
    selector   = { app = "mongodb" }
    cluster_ip = "None"
    port {
      port        = 27017
      target_port = 27017
    }
  }
}

# ── App ConfigMap ────────────────────────────────────────────
resource "kubernetes_config_map" "logviewer" {
  metadata {
    name      = "logviewer-config"
    namespace = kubernetes_namespace.logviewer.metadata[0].name
  }
  data = {
    PORT    = "3000"
    LOG_DIR = "/app/logs"
  }
}

# ── App Deployment ───────────────────────────────────────────
resource "kubernetes_deployment" "logviewer" {
  metadata {
    name      = "logviewer"
    namespace = kubernetes_namespace.logviewer.metadata[0].name
    labels    = { app = "logviewer" }
  }
  spec {
    replicas = 1
    selector {
      match_labels = { app = "logviewer" }
    }
    template {
      metadata {
        labels = { app = "logviewer" }
      }
      spec {
        container {
          name              = "logviewer"
          image             = "logviewer:latest"
          image_pull_policy = "Never"
          port { container_port = 3000 }
          env_from {
            config_map_ref {
              name = kubernetes_config_map.logviewer.metadata[0].name
            }
          }
          env {
            name = "MONGO_URI"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.mongo.metadata[0].name
                key  = "MONGO_URI"
              }
            }
          }
          volume_mount {
            name       = "logs-volume"
            mount_path = "/app/logs"
          }
          resources {
            requests = { cpu = "100m", memory = "128Mi" }
            limits   = { cpu = "500m", memory = "256Mi" }
          }
          liveness_probe {
            http_get {
              path = "/api/stats"
              port = 3000
            }
            initial_delay_seconds = 10
            period_seconds        = 15
          }
        }
        volume {
          name = "logs-volume"
          host_path {
            path = "/tmp/logs"
            type = "DirectoryOrCreate"
          }
        }
      }
    }
  }
}

# ── App Service ──────────────────────────────────────────────
resource "kubernetes_service" "logviewer" {
  metadata {
    name      = "logviewer-svc"
    namespace = kubernetes_namespace.logviewer.metadata[0].name
  }
  spec {
    selector  = { app = "logviewer" }
    type      = "NodePort"
    port {
      port        = 3000
      target_port = 3000
      node_port   = 30300
    }
  }
}
