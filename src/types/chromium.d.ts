declare module '@sparticuz/chromium' {
  const chromium: {
    args: string[]
    executablePath: Promise<string>
    headless: boolean
    defaultViewport: {
      width: number
      height: number
    }
  }
  export default chromium
} 