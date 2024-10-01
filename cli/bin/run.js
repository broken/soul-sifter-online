#!/usr/bin/env node

import path from 'node:path';
import process from 'node:process';

import {execute} from '@oclif/core'
import dotenv from 'dotenv'

dotenv.config({path: path.resolve(process.cwd(), '../.env')})
await execute({dir: import.meta.url})
