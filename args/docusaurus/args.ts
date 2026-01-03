import { Flags } from "./flags";

export interface Args {
  onlyList: boolean;
  onlyPdf: boolean;
  directoryOutput: string;
}

export namespace Args { 
  
  export function toArgs(options: Args): string[] {
      const args: string[] = [];
  
      for (const [groupKey, group] of Object.entries(options)) {
        if (!group) continue;
  
        const flagGroup = (Flags as any)[groupKey];
  
        if (!flagGroup) continue;
  
        for (const [optionKey, value] of Object.entries(group)) {
          if (value === undefined || value === null) continue;
  
          const flag = flagGroup[optionKey];
  
          if (!flag) continue;
  
          // Boolean flag
          if (typeof value === "boolean") {
            if (value) args.push(flag);
            continue;
          }
  
          // Repeatable flag
          if (Array.isArray(value)) {
            value.forEach(v => args.push(`${flag}=${v}`));
            continue;
          }
  
          // Scalar value
          args.push(`${flag}="${value}"`);
        }
      }
  
      return args;
    }
    
}