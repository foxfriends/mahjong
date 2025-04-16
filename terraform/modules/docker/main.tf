terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0.2"
    }
  }
}

locals {
  image = "${var.image_name}:${var.image_version}"
}

data "docker_registry_image" "mahjong" {
  name = local.image
}

resource "docker_image" "mahjong" {
  name          = local.image
  pull_triggers = [data.docker_registry_image.mahjong.sha256_digest]
}

resource "docker_volume" "state" {
  name = "${var.name}-state"
}

resource "docker_container" "mahjong" {
  image   = docker_image.mahjong.image_id
  name    = var.name
  restart = var.restart

  ports {
    internal = 3000
  }

  volumes {
    container_path = "/state"
    read_only      = false
  }

  network_mode = "bridge"

  healthcheck {
    test         = ["CMD", "curl", "-f", "localhost:3000/health"]
    interval     = "5s"
    retries      = 2
    start_period = "1s"
    timeout      = "500ms"
  }

  env = [
    "mahjong_state=/state",
    "mahjong_port=3000",
  ]
}
