package com.aifdphub.service;

import com.aifdphub.model.College;
import com.aifdphub.repository.CollegeRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CollegeService {

    private final CollegeRepository collegeRepository;

    public CollegeService(CollegeRepository collegeRepository) {
        this.collegeRepository = collegeRepository;
    }

    public List<College> getAllColleges() {
        return collegeRepository.findAll();
    }

    public Optional<College> getCollegeById(Long id) {
        return collegeRepository.findById(id);
    }

    public Optional<College> getCollegeByCode(String code) {
        return collegeRepository.findByCollegeCode(code);
    }

    public College createCollege(College college) {
        if (collegeRepository.existsByCollegeCode(college.getCollegeCode())) {
            throw new RuntimeException("College with this code already exists");
        }
        return collegeRepository.save(college);
    }

    public College updateCollege(Long id, College collegeDetails) {
        return collegeRepository.findById(id).map(college -> {
            college.setCollegeName(collegeDetails.getCollegeName());
            college.setDepartment(collegeDetails.getDepartment());
            college.setAddress(collegeDetails.getAddress());
            college.setWebsite(collegeDetails.getWebsite());
            if (collegeDetails.getLogo() != null) college.setLogo(collegeDetails.getLogo());
            if (collegeDetails.getPrincipalName() != null) college.setPrincipalName(collegeDetails.getPrincipalName());
            if (collegeDetails.getPrincipalSignature() != null) college.setPrincipalSignature(collegeDetails.getPrincipalSignature());
            if (collegeDetails.getHodSignature() != null) college.setHodSignature(collegeDetails.getHodSignature());
            if (collegeDetails.getCertificateTemplate() != null) college.setCertificateTemplate(collegeDetails.getCertificateTemplate());
            return collegeRepository.save(college);
        }).orElseThrow(() -> new RuntimeException("College not found"));
    }

    public void deleteCollege(Long id) {
        collegeRepository.deleteById(id);
    }
}
