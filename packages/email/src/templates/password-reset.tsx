const TRACKIO_LOGO = "https://assets.dub.co/wordmark.png";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import { Footer } from "../components/footer";

export function PasswordReset({
  email = "user@example.com",
  resetUrl = "http://localhost:3000/reset-password?token=xyz",
}: {
  email: string;
  resetUrl: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Reset your trackio password</Preview>
      <Tailwind>
        <Body className="bg-[#0F0F0F] font-sans">
          <Container className="mx-auto my-10 max-w-[600px] rounded border border-gray-200 px-10 py-8">
            <Section className="mt-6">
              <Img
                src={TRACKIO_LOGO}
                alt="trackio"
                height="40"
                className="mx-auto"
              />
            </Section>
            <Heading className="mt-8 text-xl font-semibold text-black">
              Reset Your Password
            </Heading>
            <Text className="text-sm leading-6 text-gray-700">
              Hello,
              <br />
              We received a request to reset your password for your trackio account.
              Click the button below to reset your password.
            </Text>
            <Section className="my-6 text-center">
              <Link
                href={resetUrl}
                className="inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white no-underline"
              >
                Reset Password
              </Link>
            </Section>
            <Text className="text-sm leading-6 text-gray-700">
              Or copy and paste this link into your browser:
            </Text>
            <Text className="break-words text-sm text-blue-600">
              {resetUrl.replace(/^https?:\/\//, "")}
            </Text>
            <Text className="mt-6 text-sm leading-6 text-gray-700">
              This link will expire in 1 hour for security reasons.
            </Text>
            <Text className="text-sm leading-6 text-gray-700">
              If you didn't request this password reset, you can safely ignore this email.
            </Text>
            <Footer email={email} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default PasswordReset;
