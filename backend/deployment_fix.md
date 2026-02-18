# Resolution: AWS Deployment Permissions

The deployment failed because your current IAM role (`voclabs/user4324671`) lacks the necessary permissions to create resources.

## Required Permissions (JSON Policy)
To fix this, you need to attach a policy with the following permissions to your user or role. If you are in a student lab environment, you may need to request these specifically.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "cloudformation:CreateStack",
                "cloudformation:CreateChangeSet",
                "cloudformation:ExecuteChangeSet",
                "cloudformation:DescribeStacks",
                "cloudformation:DescribeStackEvents",
                "cloudformation:GetTemplate",
                "cloudformation:DeleteStack",
                "cloudformation:UpdateStack"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:CreateTable",
                "dynamodb:DescribeTable",
                "dynamodb:DeleteTable",
                "dynamodb:UpdateTable",
                "dynamodb:TagResource"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "lambda:CreateFunction",
                "lambda:DeleteFunction",
                "lambda:GetFunction",
                "lambda:UpdateFunctionCode",
                "lambda:UpdateFunctionConfiguration",
                "lambda:AddPermission",
                "lambda:RemovePermission"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "iam:CreateRole",
                "iam:GetRole",
                "iam:PassRole",
                "iam:DeleteRole",
                "iam:AttachRolePolicy",
                "iam:DetachRolePolicy"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "apigateway:POST",
                "apigateway:GET",
                "apigateway:DELETE",
                "apigateway:PATCH",
                "apigateway:PUT"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:CreateBucket",
                "s3:PutObject",
                "s3:GetObject",
                "s3:ListBucket"
            ],
            "Resource": "*"
        }
    ]
}
```

## How to Apply
1.  **If you are using a personal account:**
    -   Log in to the AWS Console as root/admin.
    -   Go to IAM > Users > `user4324671`.
    -   Add permissions > Attach policies directly > Select `AdministratorAccess` (simplest) OR create an inline policy with the JSON above.

2.  **If you are in a restrictive lab env (Vocareum/Qwiklabs):**
    -   You might be restricted to specific resources.
    -   Check if there is a pre-created role you are supposed to use (e.g., `LabRole`).
    -   If so, we need to instruct SAM to use that role using `--role-arn`.

## Next Steps
Once you have updated the permissions:
1.  Run `cd backend`
2.  Run `sam deploy` again.
