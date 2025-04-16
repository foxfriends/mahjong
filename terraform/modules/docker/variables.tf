variable "name" {
  type = string
}

variable "config_dir" {
  type = string
}

variable "image_name" {
  type    = string
  default = "ghcr.io/foxfriends/inventory"
}

variable "image_version" {
  type    = string
  default = "main"
}

variable "restart" {
  type    = string
  default = "unless-stopped"
}
