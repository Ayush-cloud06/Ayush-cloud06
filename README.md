### Hi, I'm Ayush.

I write compliance controls as code, then try to prove they actually work.

Most compliance lives in documents that say a control exists. I care about the version a pipeline can check: a Terraform plan goes in, its findings are mapped to ISO 27001 controls, and the build passes, waits for a human, or fails. Each run leaves behind evidence that someone other than me can verify.

I'm a student in India, learning cloud security and GRC in public. You can find me at [ayushcloud.dev](https://www.ayushcloud.dev/), on [LinkedIn](https://www.linkedin.com/in/ayush-yadav-5b8578364/), or at contact@ayushcloud.dev.

### What I'm building

- **[Ayka](https://github.com/Ayush-cloud06/Ayka-Secure-Technologies-GmbH)**: a compliance gate for Terraform plans. Checkov, tfsec and OPA findings are mapped to 38 ISO/IEC 27001:2022 Annex A controls. A fail-closed evaluator decides *pass*, *needs approval* or *fail*, and every run leaves a SHA-256-checksummed evidence bundle. It also includes a deliberately insecure workload that has to fail, because a gate you have never seen fail proves nothing.
- **[cloud-platform-control-plane](https://github.com/Ayush-cloud06/cloud-platform-control-plane)**: a Terraform module that hardens a bare AWS account in one `apply`. You get MFA-gated roles and no IAM users, a tamper-evident CloudTrail, 15 CIS alarms, and opt-in break-glass access and GuardDuty. 27 `terraform test` cases check the security properties without needing AWS credentials.

### Where I started

These are older, smaller and rougher. I keep them up as a record of how I got here.

- [Compliance-Gated-Deployment-Pipeline](https://github.com/Ayush-cloud06/Compliance-Gated-Deployment-Pipeline): GitHub Actions with OIDC, running Checkov before apply and Prowler + OPA after.
- [aws-automated-remediation-guardrails](https://github.com/Ayush-cloud06/aws-automated-remediation-guardrails): EventBridge + Lambda that revoke an open SSH rule or block a public bucket.
- [aws-security-engineering-core](https://github.com/Ayush-cloud06/aws-security-engineering-core): bare Terraform modules, one per AWS security domain.
- [Cloud-Policy-Engine](https://github.com/Ayush-cloud06/Cloud-Policy-Engine): my first Rego policies.
- [cloud-security-compliance-automation](https://github.com/Ayush-cloud06/cloud-security-compliance-automation): my first boto3 scripts, for IAM key and S3 ACL audits.

### Rules I try to follow

- If a control has no test, I don't claim it.
- I say what's simulated. Ayka is a fictional company, and its apply step prints `SIMULATED APPLY`. That's stated in the README, not buried.
- Fail closed. Missing or broken scanner output counts as a failure, never a pass.

### Right now

I'm going deeper on Docker, Kubernetes and Rego, all through a security lens. Next for the control plane: AWS Organizations SCPs, and an organization trail feeding a separate log-archive account.
