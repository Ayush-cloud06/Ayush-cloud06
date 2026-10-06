**Ayush Yadav** · cloud security & compliance · India

<samp><a href="https://www.ayushcloud.dev/">ayushcloud.dev</a> · <a href="https://www.linkedin.com/in/ayush-yadav-5b8578364/">linkedin</a> · <a href="mailto:contact@ayushcloud.dev">contact@ayushcloud.dev</a></samp>

I turn compliance controls into checks a pipeline can fail.

```
ayka · last gate run on main · ci run 37265256207

workload                       decision   high   med   low
ayka-portal                    pass          0     0     6   14 excepted, each with owner + expiry
control-validation-scenarios   fail         20    34    10   built to fail; the build breaks if it passes
```

**[ayka](https://github.com/Ayush-cloud06/Ayka-Secure-Technologies-GmbH)**: Terraform plan in, decision out. Checkov, tfsec and OPA findings are mapped to 38 ISO 27001 controls, then the gate says pass, needs a human, or fail. It fails closed, and every run leaves a checksummed evidence bundle.

**[cloud-platform-control-plane](https://github.com/Ayush-cloud06/cloud-platform-control-plane)**: takes a bare AWS account to a hardened one in a single `apply`, with MFA-only roles, a tamper-evident CloudTrail and 15 CIS alarms. Its 27 tests run without AWS credentials.

<details>
<summary>older, rougher work</summary>
<br>

- [Compliance-Gated-Deployment-Pipeline](https://github.com/Ayush-cloud06/Compliance-Gated-Deployment-Pipeline): OIDC, Checkov before apply, Prowler + OPA after
- [aws-automated-remediation-guardrails](https://github.com/Ayush-cloud06/aws-automated-remediation-guardrails): EventBridge + Lambda that close open SSH and public buckets
- [aws-security-engineering-core](https://github.com/Ayush-cloud06/aws-security-engineering-core): bare Terraform, one module per AWS security domain
- [Cloud-Policy-Engine](https://github.com/Ayush-cloud06/Cloud-Policy-Engine): first Rego policies
- [cloud-security-compliance-automation](https://github.com/Ayush-cloud06/cloud-security-compliance-automation): first boto3 scripts, IAM and S3 audits

</details>

<sub>If a control has no test, I don't claim it. Ayka is a fictional company, and its apply step prints <code>SIMULATED APPLY</code>.</sub>
