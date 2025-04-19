/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
    env: {
        stackbitPreview: process.env.STACKBIT_PREVIEW
    },
    trailingSlash: true,
    reactStrictMode: true,
    // Desativando o SWC para resolver possíveis problemas de compilação
    swcMinify: false,
    // Configuração adicional para lidar com erros de módulos
    experimental: {
        // Permitir importações de ESM em CJS
        esmExternals: 'loose'
    }
};

module.exports = nextConfig;
