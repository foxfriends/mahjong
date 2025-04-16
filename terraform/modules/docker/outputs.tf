output "port" {
  value = docker_container.inventory.ports[0].external
}
