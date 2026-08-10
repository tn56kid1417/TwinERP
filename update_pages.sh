#!/bin/bash
for file in src/pages/*.tsx; do
  if grep -q "motion/react" "$file"; then
    continue
  fi
  
  if [ "$file" == "src/pages/Login.tsx" ]; then
    continue
  fi

  # Add import
  sed -i "1i import { motion } from 'motion/react';" "$file"
  
  # Replace first return div with motion.div
  # This uses awk to replace the first matching `<div className="p-8 max-w-7xl mx-auto h-full flex flex-col">`
  # and the last closing `</div>`
  
  sed -i 's/<div className="p-8 max-w-7xl mx-auto h-full flex flex-col">/<motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="p-8 max-w-7xl mx-auto h-full flex flex-col">/' "$file"
  
  # Since there are many divs, replacing the LAST `</div>` is tricky. Let's just find `</div>\n  );\n};` or something similar.
  # Actually, perl is better for multiline
  perl -0777 -pi -e 's/<\/div>\n  \);\n};/<\/motion.div>\n  );\n};/g' "$file"

done
