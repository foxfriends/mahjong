output "port" {
  value = docker_container.mahjong.ports[0].external
}
