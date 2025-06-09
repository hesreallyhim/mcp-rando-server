import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GetPromptResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { secureRandomChoice } from "../utils/crypto.js";

export function registerSecurityPrompts(server: McpServer): void {
  server.prompt(
    "diceware-security-guide",
    "Generate security guidance for diceware passphrase creation and usage",
    {
      context: z.enum(["personal", "business", "high-security"]).describe("Security context").optional(),
      includeStorage: z.string().describe("Include storage recommendations (true/false)").optional(),
    },
    async ({ context, includeStorage = "true" }): Promise<GetPromptResult> => {
      const contextGuidance = {
        personal: {
          words: "4-5 words",
          entropy: "51-64 bits",
          use: "personal accounts, email, social media"
        },
        business: {
          words: "5-6 words",
          entropy: "64-77 bits",
          use: "work accounts, shared systems, team resources"
        },
        "high-security": {
          words: "6-8 words",
          entropy: "77-103 bits",
          use: "cryptocurrency, financial accounts, critical infrastructure"
        }
      };

      const selectedContext = context ?? "personal";
      const guidance = contextGuidance[selectedContext];

      const storageText = includeStorage === "true" ? `

## Secure Storage
- Use a reputable password manager (1Password, Bitwarden, KeePass)
- Never store passphrases in plain text files or notes apps
- Consider writing down critical passphrases and storing in a secure physical location
- Use unique passphrases for each account - never reuse
- Enable two-factor authentication when available` : "";

      const securityTips = [
        "Generate passphrases offline when possible",
        "Verify the randomness source is cryptographically secure",
        "Consider the physical security of your generation environment",
        "Be aware of shoulder surfing when entering passphrases",
        "Use the EFF wordlists which are optimized for security and memorability"
      ];

      const randomTip = secureRandomChoice(securityTips);

      return {
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: `# Diceware Passphrase Security Guide

## For ${selectedContext} use:
- **Recommended length**: ${guidance.words}
- **Security level**: ~${guidance.entropy} of entropy
- **Typical use cases**: ${guidance.use}

## Security Best Practices
- Always use cryptographically secure randomness (like this MCP server)
- Choose words from established wordlists (EFF recommended)
- Consider capitalization for additional entropy if needed
- Add numbers or symbols only if required by password policies

${storageText}

## Pro Tip
${randomTip}

Generate your secure passphrase using the diceware-passphrase tool with appropriate parameters for your security context.`
          }
        }]
      };
    }
  );

  server.prompt(
    "password-policy-advisor",
    "Generate advice for creating password policies that accommodate diceware passphrases",
    {
      organization: z.enum(["small-business", "enterprise", "government", "education"]).describe("Organization type").optional(),
      compliance: z.string().describe("Compliance requirements (comma-separated: NIST,ISO27001,HIPAA,PCI-DSS,SOX)").optional(),
    },
    async ({ organization, compliance }): Promise<GetPromptResult> => {
      const orgGuidance = {
        "small-business": {
          focus: "balance security with usability",
          recommendations: "4-5 word passphrases, password manager adoption"
        },
        enterprise: {
          focus: "scalable security policies",
          recommendations: "5-6 word passphrases, centralized password management"
        },
        government: {
          focus: "high security standards",
          recommendations: "6+ word passphrases, strict generation and storage protocols"
        },
        education: {
          focus: "security education and ease of use",
          recommendations: "4-5 word passphrases, security awareness training"
        }
      };

      const selectedOrg = organization ?? "small-business";
      const orgInfo = orgGuidance[selectedOrg];

      const complianceArray = compliance ? compliance.split(",").map(c => c.trim()) : [];
      const complianceText = complianceArray.length > 0 ? `

## Compliance Considerations (${complianceArray.join(", ")})
- Document your passphrase generation methodology
- Ensure cryptographic randomness meets regulatory standards
- Implement proper audit trails for password changes
- Consider entropy requirements specified in relevant frameworks` : "";

      const policyElements = [
        "Minimum passphrase length in words rather than characters",
        "Acceptance of spaces in passwords (critical for diceware)",
        "Reduced or eliminated forced password rotation",
        "Focus on unique passwords rather than complex character requirements",
        "User education on passphrase generation and storage"
      ];

      const randomElement = secureRandomChoice(policyElements);

      return {
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: `# Password Policy Guidance for Diceware Implementation

## Organization Profile: ${selectedOrg}
**Focus**: ${orgInfo.focus}
**Recommendations**: ${orgInfo.recommendations}

## Diceware-Friendly Policy Elements

### Length Requirements
- Specify minimum in words (4-6 words) rather than characters
- Allow passphrases up to 128+ characters to accommodate longer diceware phrases
- Remove maximum length restrictions that might block secure passphrases

### Character Requirements  
- Allow spaces and standard punctuation
- Reduce or eliminate complex character requirements (numbers, symbols)
- Focus on entropy through length rather than character complexity

### Rotation and Reuse
- Extend password rotation periods (annually vs quarterly)
- Prohibit password reuse across different systems
- Allow password updates for security incidents only

### Implementation Recommendations
- Provide diceware generation tools or approved methods
- Mandate password manager usage for storage
- Include passphrase creation in security training

## Key Policy Element to Consider
${randomElement}

${complianceText}

Use this guidance to create policies that embrace the security benefits of diceware passphrases while meeting your organizational needs.`
          }
        }]
      };
    }
  );
}