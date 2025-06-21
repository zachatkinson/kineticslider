#!/bin/bash

# Create certificates directory
mkdir -p .certs

# Generate development HTTPS certificates
echo "🔒 Generating development HTTPS certificates..."

# Generate private key
openssl genrsa -out .certs/dev.key 2048

# Generate certificate signing request
openssl req -new -key .certs/dev.key -out .certs/dev.csr -subj "/C=US/ST=Development/L=Local/O=KineticSlider/CN=localhost"

# Generate self-signed certificate
openssl x509 -req -in .certs/dev.csr -signkey .certs/dev.key -out .certs/dev.crt -days 365 -extensions v3_req -extfile <(
cat <<EOF2
[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = 127.0.0.1
IP.1 = 127.0.0.1
IP.2 = ::1
EOF2
)

# Clean up CSR
rm .certs/dev.csr

echo "✅ HTTPS certificates generated!"
echo "📁 Certificates saved to .certs/"
echo "⚠️  Remember to trust the certificate in your browser"
echo ""
echo "To trust the certificate:"
echo "  macOS: sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain .certs/dev.crt"
echo "  Linux: sudo cp .certs/dev.crt /usr/local/share/ca-certificates/ && sudo update-ca-certificates"
echo "  Windows: Import .certs/dev.crt into 'Trusted Root Certification Authorities'"
