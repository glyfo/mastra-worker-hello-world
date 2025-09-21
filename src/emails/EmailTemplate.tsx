import { 
  Html, 
  Head, 
  Body, 
  Container, 
  Section, 
  Heading, 
  Text, 
  Button, 
  Link, 
  Img,
  Hr,
  Tailwind 
} from "@react-email/components";
import * as React from "react";

export interface EmailTemplateProps {
  firstName: string;
  agentName?: string;
  companyName?: string;
  unsubscribeUrl?: string;
  dashboardUrl?: string;
  logoUrl?: string;
}

const EmailTemplate: React.FC<EmailTemplateProps> = ({ 
  firstName,
  agentName = "Lily",
  companyName = "Glyfo",
  unsubscribeUrl = "https://mail.glyfo.com/unsubscribe",
  dashboardUrl = "https://app.glyfo.com/dashboard",
  logoUrl = "https://mail.glyfo.com/logo.png"
}) => {
  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="max-w-2xl mx-auto bg-white border border-gray-200">
            
            {/* Header Section */}
            <Section className="bg-blue-600 p-5 text-center">
              {logoUrl && (
                <Img
                  src={logoUrl}
                  width="120"
                  height="40"
                  alt={companyName}
                  className="mx-auto mb-2 block"
                />
              )}
              <Heading className="text-white text-2xl font-bold m-0">
                {companyName}
              </Heading>
            </Section>

            {/* Main Content */}
            <Section className="p-8">
              
              {/* Welcome Heading */}
              <Heading className="text-blue-600 text-xl font-bold mb-4">
                Welcome to {companyName}, {firstName}! 🎉
              </Heading>

              {/* Agent Introduction */}
              <Text className="text-gray-800 text-base leading-relaxed mb-4">
                Hi {firstName}, I'm {agentName}, your dedicated AI agent from the {companyName} team. 
                I'm excited to help you get the most out of our platform!
              </Text>

              {/* Value Proposition */}
              <Text className="text-gray-800 text-base leading-relaxed mb-4">
                Your account has been successfully created and verified. Here's what you can do right away:
              </Text>

              {/* Feature List */}
              <Section className="my-5">
                <Text className="text-gray-800 text-base leading-relaxed mb-2 pl-5">
                  📊 Access your personalized dashboard
                </Text>
                <Text className="text-gray-800 text-base leading-relaxed mb-2 pl-5">
                  🤖 Start conversations with AI agents
                </Text>
                <Text className="text-gray-800 text-base leading-relaxed mb-2 pl-5">
                  📈 Track your progress and analytics
                </Text>
                <Text className="text-gray-800 text-base leading-relaxed mb-2 pl-5">
                  🔧 Customize your workspace settings
                </Text>
              </Section>

              {/* Call-to-Action Button */}
              <Section className="text-center my-8">
                <Button 
                  href={dashboardUrl}
                  className="bg-blue-600 text-white text-base font-bold no-underline text-center inline-block py-3 px-7 rounded border-0 cursor-pointer"
                >
                  Access Your Dashboard →
                </Button>
              </Section>

              {/* Support Section */}
              <Section className="bg-gray-50 p-5 rounded mb-6">
                <Heading className="text-gray-700 text-lg font-bold mb-3 mt-0">
                  Need Help Getting Started?
                </Heading>
                <Text className="text-gray-600 text-sm leading-relaxed m-0">
                  I'm here to help! Reply to this email or reach out to our support team at{' '}
                  <Link href="mailto:lily.agent@mail.glyfo.com" className="text-blue-600 underline">
                    lily.agent@mail.glyfo.com
                  </Link>. We typically respond within 2 hours.
                </Text>
              </Section>

              {/* Personal Touch */}
              <Text className="text-gray-800 text-base leading-relaxed mb-4">
                Looking forward to working with you!
              </Text>

              <Text className="text-gray-800 text-base font-medium leading-relaxed mt-4 mb-0">
                Best regards,<br />
                {agentName} 🤖<br />
                <span className="text-gray-600 text-sm font-normal">
                  AI Agent at {companyName}
                </span>
              </Text>

            </Section>

            {/* Footer */}
            <Hr className="border-gray-200 my-5" />
            
            <Section className="bg-gray-50 p-5 border-t border-gray-200">
              <Text className="text-gray-600 text-xs leading-relaxed text-center mb-3">
                <strong>GLYFO, Inc.</strong><br />
                123 Innovation Drive, Suite 100<br />
                San Francisco, CA 94107, United States
              </Text>
              
              <Text className="text-gray-600 text-xs leading-relaxed text-center mb-3">
                You're receiving this email because you created an account with GLYFO.
              </Text>
              
              {/* Unsubscribe Links */}
              <Text className="text-center mt-4">
                <Link href={unsubscribeUrl} className="text-gray-600 text-xs underline mr-4">
                  Unsubscribe
                </Link>
                <Link href={`${unsubscribeUrl}?type=preferences`} className="text-gray-600 text-xs underline">
                  Update Email Preferences
                </Link>
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default EmailTemplate;