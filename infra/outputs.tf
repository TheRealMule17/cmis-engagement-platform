output "api_base_url" {
  value = "https://${aws_api_gateway_rest_api.api.id}.execute-api.${var.aws_region}.amazonaws.com/${var.stage_name}"
}

output "events_table_name" {
  value = aws_dynamodb_table.events.name
}

output "rsvps_table_name" {
  value = aws_dynamodb_table.rsvps.name
}

output "waitlist_table_name" {
  value = aws_dynamodb_table.waitlist.name
}

output "past_events_table_name" {
  value = aws_dynamodb_table.past_events.name
}

output "waitlist_queue_url" {
  value = aws_sqs_queue.waitlist_queue.url
}