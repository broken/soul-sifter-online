import { spawn } from 'node:child_process';
import process from 'node:process';

import {Args, Command, Flags} from '@oclif/core';
import mysql from 'mysql2/promise';
import { supabase } from '../supabase-client.js';


export default class Pull extends Command {
  static override args = {
    file: Args.string({description: 'file to read'}),
  }

  static override description = 'pull changes from change table'

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static override flags = {
    // flag with no value (-f, --force)
    force: Flags.boolean({char: 'f'}),
    // flag with a value (-n, --name=VALUE)
    name: Flags.string({char: 'n', description: 'name to print'}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Pull);

    // get all changes
    const { data, error } = await supabase.from('changes').select().order('id');
    if (error) {
      this.log(`Error ${error.code}: ${error.message}`);
      this.log(error.hint);
      this.log(error.details);
      throw new Error(error.message);
    }

    // create update statements
    if (!data) {
      this.log('No updates found.');
      return;
    }
    let stmts = data.map(x => `update ${x.table} set ${x.field}=${x.value} where id=${x.key};`);

    // apply changes
    let connection;
    try {
      connection = await mysql.createConnection({
          host: 'localhost',
          user: process.env.MYSQL_USER,
          password: process.env.MYSQL_PASSWORD,
          database: 'music',
      });
      stmts.forEach(async stmt => {
        this.log(`Executing: ${stmt}`);
        const [result] = await connection.execute(stmt);
        this.log('Update successful: ', result.affectedRows);
      });

      // delete applied changes
      this.executePsql(`DELETE FROM changes WHERE 1=1`);

    } catch (error) {
      this.error('Error executing query:', error);
      throw error;
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  }


  executePsql = (sql: string) => {
    return new Promise((resolve, reject) => {
      this.log(`Executing ${sql}`);
      let stdout = '';
      let stderr = '';
      const childProcess = spawn('psql', ['-h', process.env.SUPABASE_SERVER, '-p', '6543', '-d', 'postgres', '-U', process.env.SUPABASE_USER, '-c', sql], { env: { ...process.env, PGPASSWORD: process.env.SUPABASE_PASSWD} });

      // Capture standard output
      childProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        this.log(stdout);
      });

      // Capture standard error
      childProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        this.log(stderr);
      });

      // Handle process close
      childProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Process exited with code ${code}: ${stderr}`));
        }
      });

      // Handle errors from the spawn process
      childProcess.on('error', (error) => {
        reject(error);
      });
    });
  };
}
