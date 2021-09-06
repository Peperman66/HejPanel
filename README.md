# HejPanel

Deno version: **1.11.2**

## Installation
1. Install Deno from https://deno.land/
2. Make sure you've got version **1.11.2**. You can update Deno by typing ``deno upgrade --version 1.11.2``
3. Create ``.env`` file, copy there contents from the ``.env.example`` file and add required fields
4. Run the server by typing ``deno run --allow-net --allow-write --allow-read --allow-env ./index.ts``
5. Main website is at ``http://localhost:PORT`` where edit webpage is at ``http://localhost:PORT/edit.html``. Port is specified in ``.env``