# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_TURN_URL
ARG VITE_TURN_USER
ARG VITE_TURN_PASSWORD
ENV VITE_TURN_URL=$VITE_TURN_URL
ENV VITE_TURN_USER=$VITE_TURN_USER
ENV VITE_TURN_PASSWORD=$VITE_TURN_PASSWORD
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
