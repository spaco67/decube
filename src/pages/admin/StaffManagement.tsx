import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import Modal from '../../components/UI/Modal';
import { Users, UserPlus, Mail, Phone } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

const StaffManagement: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    role: 'waiter',
    password: ''
  });
  const [editingStaff, setEditingStaff] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    fetchStaffMembers();
  }, []);

  const fetchStaffMembers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStaffMembers(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewStaff(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // First sign up the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newStaff.email,
        password: newStaff.password,
        options: {
          data: {
            name: newStaff.name,
            role: newStaff.role
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user data returned');

      // Then create the user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          name: newStaff.name,
          email: newStaff.email,
          role: newStaff.role
        }]);

      if (profileError) throw profileError;

      setIsModalOpen(false);
      setNewStaff({
        name: '',
        email: '',
        role: 'waiter',
        password: ''
      });
      fetchStaffMembers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) return;
    try {
      // Delete the user profile first
      const { error: profileError } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (profileError) throw profileError;
      
      // The auth user will be automatically deleted via a database trigger
      fetchStaffMembers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEditStaff = (staff: StaffMember) => {
    setEditingStaff({
      id: staff.id,
      name: staff.name,
      email: staff.email,
      role: staff.role
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: editingStaff.name,
          role: editingStaff.role
        })
        .eq('id', editingStaff.id);

      if (error) throw error;

      setIsEditModalOpen(false);
      setEditingStaff(null);
      fetchStaffMembers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <DashboardLayout title="Staff Management">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Staff Members</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
        >
          <UserPlus size={20} className="mr-2" />
          Add Staff Member
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}

      {/* Add Staff Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Staff Member"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={newStaff.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={newStaff.email}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            <select
              name="role"
              value={newStaff.role}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            >
              <option value="waiter">Waiter</option>
              <option value="barman">Barman</option>
              <option value="kitchen">Kitchen</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={newStaff.password}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md transition-colors"
            >
              Add Staff Member
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Staff Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingStaff(null);
        }}
        title="Edit Staff Member"
      >
        {editingStaff && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                value={editingStaff.name}
                onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={editingStaff.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Email cannot be changed
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role
              </label>
              <select
                value={editingStaff.role}
                onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              >
                <option value="waiter">Waiter</option>
                <option value="barman">Barman</option>
                <option value="kitchen">Kitchen</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingStaff(null);
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </Modal>

      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">Loading staff members...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {staffMembers.map((staff) => (
                <tr key={staff.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-teal-500 flex items-center justify-center text-white">
                        {staff.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {staff.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-teal-100 text-teal-800 capitalize">
                      {staff.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Mail size={16} className="mr-2" />
                      {staff.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 capitalize">
                      active
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditStaff(staff)}
                      className="text-teal-600 hover:text-teal-900 dark:text-teal-400 dark:hover:text-teal-300 px-3 py-1 rounded-md hover:bg-teal-50 dark:hover:bg-teal-900/20 mr-2"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteStaff(staff.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 px-3 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </DashboardLayout>
  );
};

export default StaffManagement;