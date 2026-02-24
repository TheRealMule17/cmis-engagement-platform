resource "aws_sqs_queue" "waitlist_queue" {
  name                        = "${var.project_name}-waitlist-${var.stage_name}.fifo"
  fifo_queue                  = true
  content_based_deduplication = true

  visibility_timeout_seconds = 30
}