const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const UserSchema = new Schema({ clerkId: String, role: String, companyId: Schema.Types.ObjectId });
const User = model('User', UserSchema);

mongoose.connect('mongodb+srv://wocode:Fa5251596%40@re7lty.xwg0o7y.mongodb.net/re7lty?retryWrites=true&w=majority')
  .then(async () => {
    const res = await User.updateOne(
      { clerkId: 'user_38R1egID06nNd1fqUvf20oSKSuh' },
      { $set: { role: 'company_owner', companyId: '69e8f67d740caa4660a6a567' } }
    );
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
