FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf.bak 2>/dev/null || true

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
