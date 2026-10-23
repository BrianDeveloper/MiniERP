const owner = process.env.GH_OWNER?.trim()
const repo = process.env.GH_REPO?.trim()

const publish =
  owner && repo
    ? [
        {
          provider: 'github',
          owner,
          repo,
          releaseType: 'release'
        }
      ]
    : undefined

module.exports = {
  appId: 'com.minierp.desktop',
  productName: 'MiniERP',
  artifactName: '${productName}-Setup-${version}.${ext}',
  directories: {
    buildResources: 'build',
    output: 'release'
  },
  files: [
    '!**/.vscode/*',
    '!src/**',
    '!resources/**',
    '!electron.vite.config.ts',
    '!{.gitignore,.npmrc,tsconfig.json}',
    '!{release,dist}/**'
  ],
  extraResources: [
    {
      from: 'resources/config',
      to: 'config'
    }
  ],
  asar: true,
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      }
    ]
  },
  nsis: {
    oneClick: true,
    perMachine: false,
    allowElevation: true,
    allowToChangeInstallationDirectory: false,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'MiniERP',
    deleteAppDataOnUninstall: false,
    runAfterFinish: true
  },
  ...(publish ? { publish } : {})
}
