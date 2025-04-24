terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0.2"
    }
  }
}

locals {
  image         = "${var.image_name}:${var.image_version}"
  internal_port = 3000
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

  dynamic "ports" {
    for_each = var.expose ? [var.port] : []

    content {
      internal = local.internal_port
      external = ports.value
    }
  }

  volumes {
    container_path = "/state"
    volume_name    = docker_volume.state.name
    read_only      = false
  }

  network_mode = "bridge"

  dynamic "networks_advanced" {
    for_each = var.networks
    iterator = net

    content {
      name = net.value["name"]
    }
  }

  healthcheck {
    test         = ["CMD", "curl", "-f", "localhost:${local.internal_port}/health"]
    interval     = "5s"
    retries      = 2
    start_period = "1s"
    timeout      = "500ms"
  }

  env = [
    "mahjong_state=/state",
    "mahjong_port=${local.internal_port}",
  ]
}
