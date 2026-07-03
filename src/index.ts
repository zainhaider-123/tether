import { CliArgs, Command, parseArgs, dispatch } from './cli.js'

export async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  await dispatch(args)
}