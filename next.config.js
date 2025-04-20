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
    },
    // Configuração de redirecionamentos
    async redirects() {
        return [
            // Redirecionar /mcpx/ para a home
            {
                source: '/mcpx/',
                destination: '/',
                permanent: true,
            },
            // Redirecionar de /content/mcpx/... para /mcpx/...
            {
                source: '/content/mcpx/:path*',
                destination: '/mcpx/:path*',
                permanent: true,
            },
            // Redirecionar de /mcpx/... para /content/mcpx/... (para fins de compatibilidade interna)
            {
                source: '/mcpx/:path*',
                destination: '/content/mcpx/:path*',
                permanent: false,
                has: [
                    {
                        type: 'header',
                        key: 'x-nextjs-data',
                        value: '1',
                    },
                ],
            },
        ];
    },
    // Configuração de reescrita de URLs (alternativa ao redirecionamento)
    async rewrites() {
        return [
            // Reescrever /mcpx/... para /content/mcpx/... (sem redirecionamento visível)
            {
                source: '/mcpx/:path*',
                destination: '/content/mcpx/:path*',
            },
        ];
    },
};

module.exports = nextConfig;
