FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN if [ "$NODE_ENV" = "production" ]; then npm run build; else echo "Skipping build in $NODE_ENV mode"; fi

COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
