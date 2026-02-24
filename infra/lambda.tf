resource "aws_lambda_function" "event_api" {
  function_name = "${var.project_name}-api-${var.stage_name}"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 15
  memory_size   = 256

  filename         = var.lambda_zip_path
  source_code_hash = filebase64sha256(var.lambda_zip_path)

  environment {
  variables = {
    EVENTS_TABLE        = aws_dynamodb_table.events.name
    RSVPS_TABLE         = aws_dynamodb_table.rsvps.name
    WAITLIST_TABLE      = aws_dynamodb_table.waitlist.name
    PAST_EVENTS_TABLE   = aws_dynamodb_table.past_events.name
    WAITLIST_QUEUE_URL  = aws_sqs_queue.waitlist_queue.url
    STAGE               = var.stage_name
  }
}
}

resource "aws_lambda_function" "process_waitlist" {
  function_name = "${var.project_name}-process-waitlist-${var.stage_name}"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 15
  memory_size   = 256

  filename         = var.process_waitlist_zip_path
  source_code_hash = filebase64sha256(var.process_waitlist_zip_path)

  environment {
    variables = {
      EVENTS_TABLE   = aws_dynamodb_table.events.name
      RSVPS_TABLE    = aws_dynamodb_table.rsvps.name
      WAITLIST_TABLE = aws_dynamodb_table.waitlist.name
    }
  }
}

resource "aws_lambda_event_source_mapping" "process_waitlist_from_sqs" {
  event_source_arn = aws_sqs_queue.waitlist_queue.arn
  function_name    = aws_lambda_function.process_waitlist.arn
  batch_size       = 1
  enabled          = true
}
resource "aws_lambda_function" "archive_past_events" {
  function_name = "${var.project_name}-archive-past-events-${var.stage_name}"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 60
  memory_size   = 256

  filename         = var.archive_past_events_zip_path
  source_code_hash = filebase64sha256(var.archive_past_events_zip_path)

  environment {
    variables = {
      EVENTS_TABLE      = aws_dynamodb_table.events.name
      PAST_EVENTS_TABLE = aws_dynamodb_table.past_events.name
      EVENTS_GSI_NAME   = "StatusDateIndex"
    }
  }
}

resource "aws_cloudwatch_event_rule" "archive_past_events_daily" {
  name                = "${var.project_name}-archive-past-events-${var.stage_name}"
  schedule_expression = "cron(0 2 * * ? *)" # 2 AM UTC daily
}

resource "aws_cloudwatch_event_target" "archive_past_events_target" {
  rule      = aws_cloudwatch_event_rule.archive_past_events_daily.name
  target_id = "archivePastEvents"
  arn       = aws_lambda_function.archive_past_events.arn
}

resource "aws_lambda_permission" "allow_eventbridge_archive" {
  statement_id  = "AllowEventBridgeInvokeArchivePastEvents"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.archive_past_events.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.archive_past_events_daily.arn
}