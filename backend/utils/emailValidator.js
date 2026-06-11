const dns = require("dns").promises;

// List of common disposable/temporary email domains
const disposableDomains = new Set([
  "mailinator.com",
  "yopmail.com",
  "temp-mail.org",
  "tempmail.com",
  "guerrillamail.com",
  "sharklasers.com",
  "guerrillamailblock.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamail.biz",
  "grr.la",
  "10minutemail.com",
  "throwawaymail.com",
  "dispostable.com",
  "getairmail.com",
  "maildrop.cc",
  "mailnesia.com",
  "mailcatch.com",
  "trashmail.com",
  "tempmailaddress.com"
]);

/**
 * Validates if an email is formatted correctly, not disposable, and has active MX records.
 * Bypasses MX record verification if the environment lacks DNS resolution connectivity.
 * @param {string} email - The email address to validate.
 * @returns {Promise<{valid: boolean, message: string}>}
 */
async function validateEmail(email) {
  if (!email || typeof email !== "string") {
    return { valid: false, message: "Email is required and must be a string." };
  }

  // 1. Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: "Invalid email format." };
  }

  const parts = email.split("@");
  const domain = parts[parts.length - 1].toLowerCase().trim();

  // 2. Check blocklist of disposable email domains (always active, offline or online)
  if (disposableDomains.has(domain)) {
    return { valid: false, message: "Disposable or temporary email addresses are not allowed." };
  }

  // 3. DNS MX lookup with connectivity check
  try {
    const mxRecords = await dns.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return { valid: false, message: "The email domain does not have active mail servers (MX records)." };
    }
  } catch (error) {
    // If the error code indicates a network/connectivity issue with the DNS resolver,
    // or if the server environment is offline (e.g., ECONNREFUSED, EREFUSED, ETIMEOUT),
    // we bypass this check to avoid blocking valid registrations.
    const networkErrorCodes = ["ECONNREFUSED", "ETIMEOUT", "EREFUSED", "ESERVFAIL", "EAI_AGAIN"];
    if (networkErrorCodes.includes(error.code)) {
      console.warn(`[EmailValidator] DNS lookup bypassed for '${domain}' due to network/resolver error: ${error.code}`);
      return { valid: true, message: "Email validated (domain verification bypassed due to DNS connectivity issues)." };
    }

    // Check if the system is completely offline/isolated from DNS by testing a known root domain (gmail.com)
    try {
      await dns.resolveMx("gmail.com");
    } catch (dnsTestError) {
      // If gmail.com also fails, the entire DNS resolver is unreachable. Bypass MX check.
      console.warn(`[EmailValidator] Bypassing MX check for '${domain}' as the server's DNS resolver is unreachable.`);
      return { valid: true, message: "Email validated (domain verification bypassed; DNS resolver unreachable)." };
    }

    // Otherwise, treat it as a real verification failure (domain does not exist)
    return {
      valid: false,
      message: `Could not verify email domain '${domain}'. Please check if the domain exists and is spelt correctly.`
    };
  }

  return { valid: true, message: "Email is valid." };
}

module.exports = { validateEmail };
