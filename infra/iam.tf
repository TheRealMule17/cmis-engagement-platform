resource "aws_iam_role" "lambda_exec" {
  name = "${var.project_name}-lambda-exec-${var.stage_name}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect    = "Allow",
      Action    = "sts:AssumeRole",
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.project_name}-lambda-policy-${var.stage_name}"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      # CloudWatch Logs
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Resource = "*"
      },
      # DynamoDB (Events + RSVPs)
      {
        Effect = "Allow",
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:TransactWriteItems"
        ],
        Resource = [
          aws_dynamodb_table.events.arn,
          aws_dynamodb_table.rsvps.arn
        ]
      }
    ]
  })
}

data "aws_iam_policy_document" "waitlist_past_events_policy" {
  statement {
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:DeleteItem",
      "dynamodb:UpdateItem",
      "dynamodb:Query",
      "dynamodb:TransactWriteItems"
    ]
    resources = [
      aws_dynamodb_table.events.arn,
      "${aws_dynamodb_table.events.arn}/index/StatusDateIndex",
      aws_dynamodb_table.rsvps.arn,
      aws_dynamodb_table.waitlist.arn,
      aws_dynamodb_table.past_events.arn
    ]
  }

  statement {
    effect = "Allow"
    actions = [
      "sqs:SendMessage",
      "sqs:GetQueueAttributes",
      "sqs:GetQueueUrl",
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:ChangeMessageVisibility"
    ]
    resources = [
      aws_sqs_queue.waitlist_queue.arn
    ]
  }
}

resource "aws_iam_policy" "waitlist_past_events" {
  name   = "${var.project_name}-waitlist-past-events-${var.stage_name}"
  policy = data.aws_iam_policy_document.waitlist_past_events_policy.json
}

resource "aws_iam_role_policy_attachment" "attach_waitlist_past_events" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = aws_iam_policy.waitlist_past_events.arn
}