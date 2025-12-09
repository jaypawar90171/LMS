// Define field schemas for different item types
const ITEM_TYPE_SCHEMAS = {
  Book: {
    author: { type: 'string', required: false, label: 'Author' },
    isbn: { type: 'string', required: false, label: 'ISBN' },
    publisher: { type: 'string', required: false, label: 'Publisher' },
    publicationYear: { type: 'number', required: false, label: 'Publication Year' },
    edition: { type: 'string', required: false, label: 'Edition' },
    language: { type: 'string', required: false, label: 'Language' },
    pages: { type: 'number', required: false, label: 'Number of Pages' },
    genre: { type: 'string', required: false, label: 'Genre' }
  },
  
  Course: {
    instructor: { type: 'string', required: false, label: 'Instructor' },
    duration: { type: 'string', required: false, label: 'Duration' },
    level: { type: 'string', required: false, label: 'Level', enum: ['Beginner', 'Intermediate', 'Advanced'] },
    format: { type: 'string', required: false, label: 'Format', enum: ['Online', 'Offline', 'Hybrid'] },
    prerequisites: { type: 'string', required: false, label: 'Prerequisites' },
    certification: { type: 'boolean', required: false, label: 'Certification Available' }
  },
  
  Toy: {
    brand: { type: 'string', required: false, label: 'Brand' },
    model: { type: 'string', required: false, label: 'Model' },
    color: { type: 'string', required: false, label: 'Color' },
    material: { type: 'string', required: false, label: 'Material' },
    ageGroup: { type: 'string', required: false, label: 'Age Group' },
    batteryRequired: { type: 'boolean', required: false, label: 'Battery Required' },
    safetyRating: { type: 'string', required: false, label: 'Safety Rating' },
    dimensions: { type: 'string', required: false, label: 'Dimensions' }
  },
  
  Equipment: {
    brand: { type: 'string', required: false, label: 'Brand' },
    model: { type: 'string', required: false, label: 'Model' },
    serialNumber: { type: 'string', required: false, label: 'Serial Number' },
    specifications: { type: 'string', required: false, label: 'Specifications' },
    warrantyPeriod: { type: 'string', required: false, label: 'Warranty Period' },
    maintenanceSchedule: { type: 'string', required: false, label: 'Maintenance Schedule' }
  },
  
  Game: {
    platform: { type: 'string', required: false, label: 'Platform' },
    genre: { type: 'string', required: false, label: 'Genre' },
    players: { type: 'string', required: false, label: 'Number of Players' },
    ageRating: { type: 'string', required: false, label: 'Age Rating' },
    developer: { type: 'string', required: false, label: 'Developer' },
    releaseYear: { type: 'number', required: false, label: 'Release Year' }
  },
  
  Reference: {
    author: { type: 'string', required: false, label: 'Author' },
    publisher: { type: 'string', required: false, label: 'Publisher' },
    edition: { type: 'string', required: false, label: 'Edition' },
    subject: { type: 'string', required: false, label: 'Subject' },
    isbn: { type: 'string', required: false, label: 'ISBN' },
    publicationYear: { type: 'number', required: false, label: 'Publication Year' }
  }
};

// Validate type-specific fields
const validateTypeSpecificFields = (itemType, fields) => {
  const schema = ITEM_TYPE_SCHEMAS[itemType];
  if (!schema) {
    throw new Error(`Invalid item type: ${itemType}`);
  }

  const errors = [];
  
  // Check required fields
  Object.entries(schema).forEach(([fieldName, fieldSchema]) => {
    if (fieldSchema.required && (!fields[fieldName] || fields[fieldName] === '')) {
      errors.push(`${fieldSchema.label} is required for ${itemType}`);
    }
    
    // Validate enum values
    if (fields[fieldName] && fieldSchema.enum && !fieldSchema.enum.includes(fields[fieldName])) {
      errors.push(`${fieldSchema.label} must be one of: ${fieldSchema.enum.join(', ')}`);
    }
    
    // Validate data types
    if (fields[fieldName]) {
      if (fieldSchema.type === 'number' && isNaN(Number(fields[fieldName]))) {
        errors.push(`${fieldSchema.label} must be a number`);
      }
      if (fieldSchema.type === 'boolean' && typeof fields[fieldName] !== 'boolean') {
        errors.push(`${fieldSchema.label} must be true or false`);
      }
    }
  });

  return errors;
};

// Get field schema for a specific item type
const getFieldsForItemType = (itemType) => {
  return ITEM_TYPE_SCHEMAS[itemType] || {};
};

module.exports = {
  ITEM_TYPE_SCHEMAS,
  validateTypeSpecificFields,
  getFieldsForItemType
};