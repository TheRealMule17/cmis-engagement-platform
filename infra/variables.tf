variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "project_name" {
  type    = string
  default = "twelfth-man-event-core"
}

variable "stage_name" {
  type    = string
  default = "dev"
}

variable "lambda_zip_path" {
  type    = string
  default = "../event-service/dist/lambda.zip"
}

variable "process_waitlist_zip_path" {
  type    = string
  default = "../backend/dist/processWaitlist.zip"
}

variable "archive_past_events_zip_path" {
  type    = string
  default = "../backend/dist/archivePastEvents.zip"
}
