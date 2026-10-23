const required = ['GH_OWNER', 'GH_REPO', 'GH_TOKEN']
const missing = required.filter((name) => !process.env[name]?.trim())

if (missing.length > 0) {
  console.error(`Faltan variables para publicar: ${missing.join(', ')}`)
  console.error('Configura las variables y vuelve a ejecutar pnpm release.')
  process.exit(1)
}

console.log(`Publicando ${process.env.GH_OWNER}/${process.env.GH_REPO} en GitHub Releases.`)
