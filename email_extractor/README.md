# Email Extractor Tool

This tool helps extract and analyze emails based on specific senders and keywords. It's designed to streamline email processing and data extraction from your inbox.

## 🚀 Features

- Extract emails from specific senders
- Filter emails based on keywords
- Process attachments (if applicable)
- Export results in structured format
- Easy to configure and extend

## 📋 Prerequisites

- Node.js (v14 or higher)
- Access to email account (Gmail recommended)
- Proper email credentials configured

## 🛠️ Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your email credentials in `.env`:
   ```env
   EMAIL_USER=your.email@gmail.com
   EMAIL_PASSWORD=your-app-specific-password
   ```

## 📝 Configuration

### Adding New Senders

1. Open `config/senders.json`:
   ```json
   {
     "senders": [
       "example@company.com",
       "notifications@service.com"
     ]
   }
   ```
2. Add new email addresses to the array

### Adding Keywords

1. Open `config/keywords.json`:
   ```json
   {
     "keywords": [
       "invoice",
       "payment",
       "receipt"
     ]
   }
   ```
2. Add new keywords to filter by

## 🔄 Workflow

1. **Start the Tool**
   ```bash
   npm start
   ```

2. **Select Operation Mode**
   - Quick Scan: Last 24 hours
   - Full Scan: All emails
   - Custom Range: Specify dates

3. **Processing Steps**
   1. Connects to email server
   2. Retrieves emails matching criteria
   3. Filters by keywords
   4. Processes attachments (if any)
   5. Generates report

4. **View Results**
   - Results are saved in `output/`
   - Logs are stored in `logs/`

## 📊 Output Format

Results are saved in JSON format:
```json
{
  "date": "2025-11-09",
  "emails": [
    {
      "sender": "example@company.com",
      "subject": "Invoice #123",
      "date": "2025-11-09T10:00:00Z",
      "keywords_found": ["invoice", "payment"],
      "attachments": ["invoice.pdf"]
    }
  ]
}
```

## 🔧 Customization

### Custom Filters

Create new filters in `src/filters/`:
```javascript
module.exports = {
  name: 'customFilter',
  condition: (email) => {
    // Your filter logic here
    return true/false;
  }
};
```

### Custom Processors

Add new processors in `src/processors/`:
```javascript
module.exports = {
  name: 'customProcessor',
  process: async (email) => {
    // Your processing logic here
    return result;
  }
};
```

## 🚨 Troubleshooting

Common issues and solutions:

1. **Connection Failed**
   - Check internet connection
   - Verify email credentials
   - Ensure less secure app access is enabled (for Gmail)

2. **No Results**
   - Check sender list configuration
   - Verify keyword list
   - Confirm email date range

3. **Processing Errors**
   - Check log files in `logs/`
   - Verify file permissions
   - Ensure sufficient disk space

## 📈 Best Practices

1. **Regular Updates**
   - Keep sender list current
   - Update keywords periodically
   - Review and clean output directory

2. **Performance**
   - Use specific date ranges
   - Limit keyword list size
   - Clean old logs regularly

3. **Security**
   - Never commit `.env` file
   - Use app-specific passwords
   - Regularly rotate credentials

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Support

For support:
- Open an issue
- Contact maintainers
- Check documentation

---

Remember to keep your configurations up to date and regularly backup important data!