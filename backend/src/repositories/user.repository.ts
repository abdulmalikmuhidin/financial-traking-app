import { User, IUser } from '../models/User';

export class UserRepository {
  async findByEmail(email: string) {
    return User.findOne({ email: email.toLowerCase().trim() });
  }

  async findById(id: string) {
    return User.findById(id);
  }

  async findByIdWithoutPassword(id: string) {
    return User.findById(id).select('-password');
  }

  async create(data: Partial<IUser>) {
    const user = new User(data);
    return user.save();
  }

  async updateById(id: string, updates: Partial<IUser>) {
    return User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
  }
}

export const userRepository = new UserRepository();

