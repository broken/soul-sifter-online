import process from 'node:process';

import {Args, Command, Flags} from '@oclif/core'
import { createClient } from '@supabase/supabase-js'


export default class Pull extends Command {
  static override args = {
    file: Args.string({description: 'file to read'}),
  }

  static override description = 'describe the command here'

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

    // initialize supabase
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // get all changes
    const { data, error } = await supabase.from('changes').select().order('id');
    if (error) {
      this.log(`Error ${error.code}: ${error.message}`);
      this.log(error.hint);
      this.log(error.details);
    }
    if (data) {
      data.forEach((x) => {
        this.log(`update ${x.table} set ${x.field}=${x.value} where id=${x.key};`);
      });
    }

    // apply changes

    // delete applied changes
  }
}
