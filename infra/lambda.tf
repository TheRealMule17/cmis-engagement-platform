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
      EVENTS_TABLE = aws_dynamodb_table.events.name
      RSVPS_TABLE  = aws_dynamodb_table.rsvps.name
      STAGE        = var.stage_name
    }
  }
}
