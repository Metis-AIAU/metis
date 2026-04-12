import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  FolderKanban,
  AlertTriangle,
  Shield,
  Calendar,
  Tag,
  Users,
  X,
  Brain,
  Sparkles,
} from 'lucide-react';
import { useThreatContext } from '../context/ThreatContext';
import AIAnalysisModal from '../components/AIAnalysisModal';
import { v4 as uuidv4 } from 'uuid';

export default function Projects() {
  const navigate = useNavigate();
  const {
    state,
    addProjectWithId,
    updateProject,
    deleteProject,
    setCurrentProject,
    getRiskStats,
    getControlStats,
    getMitigationProgress,
    importAIResults,
  } = useThreatContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    owner: '',
    status: 'active',
    tags: '',
  });

  // AI Analysis state
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [projectForAnalysis, setProjectForAnalysis] = useState(null);
  const [runAIAnalysis, setRunAIAnalysis] = useState(true);

  const filteredProjects = state.projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const projectData = {
      ...formData,
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
    };

    if (editingProject) {
      updateProject({ ...projectData, id: editingProject.id });
      setShowModal(false);
      setEditingProject(null);
    } else {
      // Create new project with a known ID for AI analysis
      const newProjectId = uuidv4();
      const newProject = {
        ...projectData,
        id: newProjectId,
      };
      addProjectWithId(newProject);
      setShowModal(false);

      // Trigger AI analysis for new projects
      if (runAIAnalysis) {
        setProjectForAnalysis(newProject);
        setShowAIAnalysis(true);
      }
    }

    setEditingProject(null);
    setFormData({ name: '', description: '', owner: '', status: 'active', tags: '' });
  };

  const handleAIAnalysisComplete = (results) => {
    if (results && projectForAnalysis) {
      importAIResults(results);
      // Navigate to the project detail page after analysis
      setCurrentProject(projectForAnalysis);
      navigate(`/projects/${projectForAnalysis.id}`);
    }
    setProjectForAnalysis(null);
  };

  const handleRunAIAnalysis = (project) => {
    setProjectForAnalysis(project);
    setShowAIAnalysis(true);
    setActiveDropdown(null);
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      owner: project.owner || '',
      status: project.status || 'active',
      tags: project.tags?.join(', ') || '',
    });
    setShowModal(true);
    setActiveDropdown(null);
  };

  const handleDelete = (projectId) => {
    if (confirm('Are you sure you want to delete this project? All associated threats and controls will also be deleted.')) {
      deleteProject(projectId);
    }
    setActiveDropdown(null);
  };

  const handleSelectProject = (project) => {
    setCurrentProject(project);
    navigate(`/projects/${project.id}`);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 mt-1">Manage your threat modeling projects and scenarios</p>
        </div>
        <button
          onClick={() => navigate('/projects/new')}
          className="btn-primary"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Project
        </button>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
      </motion.div>

      {/* Projects Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredProjects.map((project, index) => {
          const riskStats = getRiskStats(project.id);
          const controlStats = getControlStats(project.id);
          const progress = getMitigationProgress(project.id);

          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card-hover group relative"
            >
              {/* Dropdown Menu */}
              <div className="absolute top-4 right-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDropdown(activeDropdown === project.id ? null : project.id);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                <AnimatePresence>
                  {activeDropdown === project.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-10"
                    >
                      <button
                        onClick={() => handleSelectProject(project)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      <button
                        onClick={() => handleRunAIAnalysis(project)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-purple-600 hover:bg-purple-50"
                      >
                        <Brain className="w-4 h-4" />
                        Run AI Analysis
                      </button>
                      <button
                        onClick={() => handleEdit(project)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Project Content */}
              <div onClick={() => handleSelectProject(project)} className="cursor-pointer">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <FolderKanban className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0 pr-8">
                    <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">{project.description}</p>
                  </div>
                </div>

                {/* Tags */}
                {project.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="badge-info">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                    {project.tags.length > 3 && (
                      <span className="text-xs text-gray-400">+{project.tags.length - 3} more</span>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-red-500 mb-1">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="font-bold">{riskStats.total}</span>
                    </div>
                    <p className="text-xs text-gray-500">Threats</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-green-500 mb-1">
                      <Shield className="w-4 h-4" />
                      <span className="font-bold">{controlStats.total}</span>
                    </div>
                    <p className="text-xs text-gray-500">Controls</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-blue-500 mb-1">
                      <span className="font-bold">{progress}%</span>
                    </div>
                    <p className="text-xs text-gray-500">Mitigated</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      progress >= 80
                        ? 'bg-gradient-to-r from-green-400 to-green-600'
                        : progress >= 50
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                        : 'bg-gradient-to-r from-red-400 to-red-600'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="w-4 h-4" />
                    <span>{project.owner || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Risk indicators */}
                {riskStats.critical > 0 && (
                  <div className="absolute top-4 left-4">
                    <span className="badge-critical animate-pulse">
                      {riskStats.critical} Critical
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <div className="col-span-full text-center py-16">
            <FolderKanban className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? 'Try a different search term' : 'Create your first project to get started'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate('/projects/new')}
                className="btn-primary"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Project
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingProject ? 'Edit Project' : 'Create New Project'}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="label">Project Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="e.g., E-Commerce Platform"
                    required
                  />
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input min-h-[100px]"
                    placeholder="Describe the project scope and objectives..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Owner</label>
                    <input
                      type="text"
                      value={formData.owner}
                      onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                      className="input"
                      placeholder="Team or person name"
                    />
                  </div>

                  <div>
                    <label className="label">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="input"
                    >
                      <option value="planning">Planning</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="input"
                    placeholder="e.g., web, payments, pci-dss"
                  />
                </div>

                {/* AI Analysis Toggle - only show for new projects */}
                {!editingProject && (
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                          <Brain className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 flex items-center gap-2">
                            AI Threat Analysis
                            <Sparkles className="w-4 h-4 text-purple-500" />
                          </p>
                          <p className="text-sm text-gray-500">
                            Automatically identify threats and recommend controls
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={runAIAnalysis}
                          onChange={(e) => setRunAIAnalysis(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingProject ? 'Save Changes' : 'Create Project'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close dropdown */}
      {activeDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setActiveDropdown(null)}
        />
      )}

      {/* AI Analysis Modal */}
      <AIAnalysisModal
        project={projectForAnalysis}
        isOpen={showAIAnalysis}
        onClose={() => {
          setShowAIAnalysis(false);
          setProjectForAnalysis(null);
        }}
        onComplete={handleAIAnalysisComplete}
      />
    </div>
  );
}
